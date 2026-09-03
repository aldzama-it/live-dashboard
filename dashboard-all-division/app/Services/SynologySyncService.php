<?php

namespace App\Services;

use App\Models\SynologySyncLog;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Icewind\SMB\ServerFactory;
use Icewind\SMB\BasicAuth;

class SynologySyncService
{
    /**
     * Run the sync process for all configured divisions.
     *
     * @return array Summary of the sync process
     */
    public function syncAll(): array
    {
        $divisions = config('synology.divisions', []);
        
        $summary = [];

        foreach ($divisions as $divisionName => $config) {
            $summary[$divisionName] = $this->syncDivision($divisionName, $config);
        }

        return $summary;
    }

    /**
     * Sync data for a specific division via SMB package.
     */
    public function syncDivision(string $divisionName, array $config): array
    {
        $relativePath = $config['file'] ?? null;
        if (!$relativePath) {
            return ['status' => 'skipped', 'message' => 'No file configured.'];
        }

        $connectionConfig = config('synology.connection');
        $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
        $tempDir = storage_path('app/temp');
        if (!File::exists($tempDir)) {
            File::makeDirectory($tempDir, 0755, true);
        }
        $tempFilePath = $tempDir . '/' . uniqid('sync_') . '_' . basename($relativePath);
        
        try {
            if ($isWindows) {
                // FALLBACK UNTUK WINDOWS: Menggunakan 'net use' dan UNC Path
                $host = $connectionConfig['host'];
                $share = $connectionConfig['share'];
                $user = $connectionConfig['username'];
                $pass = $connectionConfig['password'];
                $uncPath = "\\\\{$host}\\{$share}";
                
                // Cek apakah sudah terkoneksi ke share (menghindari net use berulang)
                if (!is_dir($uncPath)) {
                    // Hapus koneksi sebelumnya untuk mencegah System error 1219 (Multiple connections)
                    exec("net use {$uncPath} /delete /y 2>NUL");
                    
                    // Login session via Windows CMD
                    exec("net use {$uncPath} \"{$pass}\" /user:{$user} 2>&1", $output, $returnVar);
                    $outputStr = implode(" ", $output);
                    
                    if ($returnVar !== 0 && stripos($outputStr, 'multiple connections') === false) {
                        throw new \Exception("Net Use Auth Failed: " . $outputStr);
                    }
                }
                
                $fullPath = $uncPath . '\\' . str_replace('/', '\\', $relativePath);
                
                if (!File::exists($fullPath)) {
                    throw new \Exception("File not found on Windows UNC path: " . $fullPath);
                }
                
                $mtime = filemtime($fullPath);
                $fileModifiedAt = date('Y-m-d H:i:s', $mtime);
                
                // Copy file secara native
                if (!copy($fullPath, $tempFilePath)) {
                    throw new \Exception("Failed to copy file from Synology to temp directory.");
                }
                
            } else {
                // LINUX/MAC: Menggunakan icewind/smb
                $serverFactory = new ServerFactory();
                $auth = new BasicAuth($connectionConfig['username'], 'WORKGROUP', $connectionConfig['password']);
                $server = $serverFactory->createServer($connectionConfig['host'], $auth);
                $share = $server->getShare($connectionConfig['share']);

                $smbPath = '/' . ltrim($relativePath, '/');
                $node = $share->getFile($smbPath);
                
                $mtime = $node->getStat()->getMTime();
                $fileModifiedAt = date('Y-m-d H:i:s', $mtime);
                
                $remoteStream = $node->read();
                $localStream = fopen($tempFilePath, 'w');
                stream_copy_to_stream($remoteStream, $localStream);
                fclose($localStream);
                fclose($remoteStream);
            }

        } catch (\Icewind\SMB\Exception\NotFoundException $e) {
            Log::warning("SynologySync: File not found for division {$divisionName} on SMB", ['path' => $relativePath]);
            return ['status' => 'failed', 'message' => 'File not found.'];
        } catch (\Exception $e) {
            Log::error("SynologySync: SMB Connection error for division {$divisionName}", ['error' => $e->getMessage()]);
            return ['status' => 'failed', 'message' => 'Connection Error: ' . $e->getMessage()];
        }

        // Check last successful sync
        $lastSync = SynologySyncLog::where('division', $divisionName)
            ->where('file_path', $relativePath)
            ->where('status', 'SUCCESS')
            ->orderBy('created_at', 'desc')
            ->first();

        if ($lastSync && $lastSync->file_modified_at && $lastSync->file_modified_at->format('Y-m-d H:i:s') === $fileModifiedAt) {
            return ['status' => 'skipped', 'message' => 'File unchanged.'];
        }

        $log = SynologySyncLog::create([
            'division' => $divisionName,
            'file_name' => basename($relativePath),
            'file_path' => $relativePath,
            'file_modified_at' => $fileModifiedAt,
            'status' => 'PENDING',
            'started_at' => now(),
        ]);

        try {
            $imports = $config['imports'] ?? [];
            if (empty($imports)) {
                throw new \Exception("No imports configured for division {$divisionName}");
            }

            // Import dari local temp file
            foreach ($imports as $module => $importClass) {
                if (class_exists($importClass)) {
                    Excel::import(new $importClass, $tempFilePath);
                }
            }

            // Hapus file temp
            if (File::exists($tempFilePath)) {
                File::delete($tempFilePath);
            }

            $log->update([
                'status' => 'SUCCESS',
                'completed_at' => now(),
            ]);

            return ['status' => 'success', 'message' => 'Data imported successfully.'];

        } catch (\Exception $e) {
            $log->update([
                'status' => 'FAILED',
                'completed_at' => now(),
                'error_message' => $e->getMessage(),
            ]);

            Log::error("SynologySync Failed for {$divisionName}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            // Hapus temp file jika error
            if (isset($tempFilePath) && File::exists($tempFilePath)) {
                File::delete($tempFilePath);
            }

            return ['status' => 'failed', 'message' => $e->getMessage()];
        }
    }
}

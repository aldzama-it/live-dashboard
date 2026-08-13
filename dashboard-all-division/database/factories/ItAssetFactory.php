<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ItAsset>
 */
class ItAssetFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = $this->faker->randomElement(['general', 'individual']);
        $assetNames = [
            'general' => ['Server Rack', 'Switch Cisco', 'Router Mikrotik', 'Access Point Unifi', 'CCTV Camera', 'UPS APC', 'Printer Epson'],
            'individual' => ['Laptop Lenovo ThinkPad', 'Laptop Dell XPS', 'Laptop HP ProBook', 'MacBook Pro', 'PC Desktop Build']
        ];
        
        $conditions = ['Good', 'Fair', 'Needs Repair', 'Broken'];
        $departments = ['IT', 'Finance', 'HR', 'Marketing', 'Operations', 'Engineering'];
        
        $data = [
            'type' => $type,
            'asset_name' => $this->faker->randomElement($assetNames[$type]),
            'brand_description' => $this->faker->company . ' ' . $this->faker->word,
            'location' => 'Lantai ' . $this->faker->numberBetween(1, 10) . ' Ruang ' . $this->faker->randomElement(['A', 'B', 'C']),
            'condition' => $this->faker->randomElement($conditions),
        ];
        
        if ($type === 'individual') {
            $data['receiver_name'] = $this->faker->name;
            $data['department'] = $this->faker->randomElement($departments);
            $data['division_project'] = 'Project ' . $this->faker->word;
            $data['handover_date'] = $this->faker->dateTimeBetween('-2 years', 'now')->format('Y-m-d');
            $data['specification'] = 'Intel Core i' . $this->faker->randomElement([5, 7, 9]) . ', ' . $this->faker->randomElement([8, 16, 32]) . 'GB RAM, ' . $this->faker->randomElement([256, 512, 1024]) . 'GB SSD';
        }
        
        return $data;
    }
}

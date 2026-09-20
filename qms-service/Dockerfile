FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HOST=0.0.0.0 \
    PORT=5002

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY *.py ./
COPY templates ./templates

# Excel source files are mounted through Compose so business data stays out of
# the image. Uploaded workbooks persist in the qms_storage volume.
CMD ["gunicorn", "--bind", "0.0.0.0:5002", "--workers", "2", "--access-logfile", "-", "app:app"]

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY nlp_processor.py ./

# This is a batch processor. It connects to the configured database, updates
# keyword records, and exits when the run is complete.
CMD ["python", "nlp_processor.py"]

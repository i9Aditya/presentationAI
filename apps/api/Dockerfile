FROM python:3.12-slim

# Install Node.js
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirement files
COPY package.json ./
COPY apps/api/requirements.txt ./requirements.txt

# Install dependencies
RUN npm install --omit=dev && pip install --no-cache-dir -r requirements.txt

# Copy internal packages first
COPY packages ./packages

# Copy the API code into the 'app' package
COPY apps/api/app ./app

# Create generated directory
RUN mkdir -p generated

# Ensure PYTHONPATH includes the root so 'app' is found
ENV PYTHONPATH=/app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

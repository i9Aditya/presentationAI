FROM python:3.12-slim

# Install Node.js
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node dependencies
COPY package.json ./
RUN npm install --omit=dev

# Install Python dependencies
COPY apps/api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the necessary API code to the root 'app' package
COPY apps/api/app ./app
# Copy other internal dependencies if any (like packages)
COPY packages ./packages

# Create the generated directory
RUN mkdir -p generated

EXPOSE 8000
# Run uvicorn from the /app directory, looking for the 'app' package
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

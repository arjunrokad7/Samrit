FROM node:22-alpine

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
COPY shared/ /app/shared/

# Expose Vite port
EXPOSE 5173

# Start Vite with host binding so Docker can see it
CMD ["npm", "run", "dev", "--", "--host"]

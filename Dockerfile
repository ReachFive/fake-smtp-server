# --- build stage: compile the React UI (needs devDependencies) ---
FROM node:22-alpine AS build

WORKDIR /www

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- runtime stage: backend only, production deps + compiled UI ---
FROM node:22-alpine

WORKDIR /www

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY index.js ./
COPY --from=build /www/build ./build

EXPOSE 1025
EXPOSE 1080

CMD ["node", "index.js"]

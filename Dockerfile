# ---- Base Node ----
FROM node:carbon AS base
# Create app directory
WORKDIR /app

# ---- Dependencies ----
FROM base AS dependencies
COPY package*.json ./
COPY yarn.lock ./
RUN yarn install

# ---- Copy Files/Build ----
FROM dependencies AS build
WORKDIR /app
COPY src /app/src
COPY public /app/public
RUN yarn build
RUN yarn install --modules-folder /app/deps --production=true

# --- Release with Alpine ----
FROM node:10.9.0-alpine AS release
WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/deps ./node_modules
COPY index.js ./


EXPOSE 1025
EXPOSE 1080

CMD node index.js -s ${SMTP_PORT:-1025} --smtp-ip ${SMTP_IP:-0.0.0.0} --http-port ${HTTP_PORT:-1080} --http-ip ${HTTP_IP:-0.0.0.0} --whitelist ${WHITELIST:-''} --max ${MAX:-100} --auth ${AUTH:-''} --headers
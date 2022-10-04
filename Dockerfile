FROM mhart/alpine-node:14 as buildStage
WORKDIR /www
COPY . .
RUN npm i && npm run build

FROM mhart/alpine-node:14 as deps
WORKDIR /www
COPY package*.json ./
RUN npm ci --prod

FROM mhart/alpine-node:slim-14
RUN addgroup -g 1000 node \
    && adduser -u 1000 -G node -D node
USER node
WORKDIR /www
COPY --chown=node:node . .
COPY --chown=node:node  --from=buildStage /www/build ./build
COPY --chown=node:node  --from=deps /www ./
EXPOSE 1025
EXPOSE 1080

ENTRYPOINT ["node", "index.js"]
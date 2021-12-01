# syntax=docker/dockerfile:1

FROM node:16-alpine

ENV NODE_ENV=production

WORKDIR /tmp

COPY ["package.json", "package-lock.json", "./"]

RUN npm install

WORKDIR /app

RUN mv /tmp/node_modules .

COPY . .

CMD npm run start-jobs

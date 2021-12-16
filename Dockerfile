# syntax=docker/dockerfile:1

FROM node:16-alpine
WORKDIR /app

ARG port=5550
ARG env=production

ENV NODE_ENV=$env
ENV PORT=$port

COPY ["package.json", "package-lock.json", "./"]

RUN ["npm", "ci"]

EXPOSE $PORT

COPY . .


CMD ["npm", "run", "start"]
# syntax=docker/dockerfile:1

FROM node:16-alpine

ENV NODE_ENV=development

WORKDIR /app

COPY ["package.json", "package-lock.json", "./"]

RUN npm install

COPY . .

# Created by WebStorm
FROM reddit-bot:latest
WORKDIR /tmp/project_modules
COPY package.json /tmp/project_modules/package.json
RUN npm install .
COPY start.sh /tmp/project_modules/start.sh
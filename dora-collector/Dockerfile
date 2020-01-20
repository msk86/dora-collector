FROM node:10

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY index.js ./
CMD [ "node" ]
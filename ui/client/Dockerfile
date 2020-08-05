FROM node:10.19.0-slim
WORKDIR /ui

# CACHING STAGE FOR npm install
COPY ./package.json ./package.json
RUN npm i

# CACHING STAGE FOR npm run build
COPY ./ /ui
RUN npm run build

EXPOSE 3000
CMD ./entrypoint.sh
FROM node:10.19.0-slim
WORKDIR /api

# CACHING STAGE FOR npm install
COPY ./package.json ./package.json
RUN npm i

COPY ./ /api
EXPOSE 8000
CMD ./entrypoint.sh
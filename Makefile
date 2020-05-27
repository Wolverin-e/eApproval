HOST_IP := $(shell ipconfig getifaddr en0)
export HOST_IP


default:
	make start
	make build-images
	make start-apis

build-images:
	docker build -t eprocurement/api:1.0 ./api

rm-images:
	docker rmi eprocurement/api:1.0

start-apis:
	docker-compose -f api/docker-compose-api.yaml up -d

stop-apis:
	docker-compose -f api/docker-compose-api.yaml down

start:
	./startNet.sh up
	./deploy.sh -ap

upgrade:
	./upgrade.sh

stop:
	./startNet.sh down
	make stop-apis
	make rm-images
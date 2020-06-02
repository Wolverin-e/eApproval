ifeq ($(shell uname -s),Linux)
	HOST_IP := $(shell ip -6 addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
endif
ifeq ($(shell uname -s),Darwin)
	HOST_IP := $(shell ipconfig getifaddr en0)
endif
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
	# make rm-images
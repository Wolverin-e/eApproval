ifeq ($(shell uname -s),Linux)
	HOST_IP := $(shell ip -6 addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
endif
ifeq ($(shell uname -s),Darwin)
	HOST_IP := $(shell ipconfig getifaddr en0)
endif
export HOST_IP

default:
	make start-network
	make build-app-images
	make start-app-containers

build-app-images:
	docker build -t eapproval/api:1.0 ./api
	# docker build -t eapproval/ui:1.0 ./ui/client

rm-app-images:
	docker rmi eapproval/api:1.0
	# docker rmi eapproval/ui:1.0

start-app-containers:
	docker-compose -f api/docker-compose-api.yaml up -d
	# docker run --name eapproval_ui -d -p 3000:3000 eapproval/ui:1.0

stop-app-containers:
	docker-compose -f api/docker-compose-api.yaml down
	# docker rm -f eapproval_ui

start-network:
	./startNet.sh up
	./deploy.sh -ape

upgrade:
	./upgrade.sh

stop:
	./startNet.sh down
	make stop-app-containers
	docker-compose -f configs/docker-compose-explorer.yaml down --volumes --remove-orphans
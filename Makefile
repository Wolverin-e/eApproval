api-images:
	docker build -t eprocurement/api:1.0 ./api
run-apis:
	docker-compose -f api/docker-compose-api.yaml up -d
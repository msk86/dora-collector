#!/bin/sh
./grafana/deploy.sh
./dora-collector/deploy.sh
kubectl delete -f deploy
kubectl apply -f deploy

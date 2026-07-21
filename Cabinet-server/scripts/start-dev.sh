#!/bin/bash
docker compose --profile dev down -v
docker compose --profile dev up -d --build
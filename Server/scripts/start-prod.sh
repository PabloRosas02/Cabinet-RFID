#!/bin/bash
docker compose --profile prod down
docker compose --profile prod up -d --build
#!/bin/bash
#subir base de datos se tiene que estar en la carpeta backend
npx prisma migrate dev --name agregar_receptor_pedido

docker exec -it rfid_backend npx prisma db seed

npx prisma@5 db push  
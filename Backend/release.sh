#!/bin/bash

dotnet publish ./backend.csproj -c Release -o /var/www/berry-sites/api

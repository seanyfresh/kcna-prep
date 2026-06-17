.DEFAULT_GOAL := help
SHELL := /bin/bash

PORT ?= 4178

.PHONY: help serve lint links docker-build docker-run up down version

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | sort | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

serve: ## Run the app locally (serve.py) and open the browser
	@python3 serve.py --port $(PORT)

lint: ## Syntax-check every JS file and lint the HTML
	@set -e; \
	  for f in $$(find assets data service-worker.js -name '*.js' 2>/dev/null); do \
	    echo "node --check $$f"; node --check "$$f"; \
	  done; \
	  npx --yes htmlhint index.html

links: ## Check markdown links (needs lychee installed)
	@lychee --no-progress './**/*.md' || true

docker-build: ## Build the container image
	@docker build -t kcna-prep .

docker-run: docker-build ## Build and run the container on $(PORT)
	@docker run --rm -p $(PORT):8080 kcna-prep

up: ## Start with docker compose (detached)
	@docker compose up -d --build && echo "→ http://localhost:$(PORT)"

down: ## Stop docker compose
	@docker compose down

version: ## Print the current version
	@cat VERSION

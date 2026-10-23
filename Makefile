.PHONY: setup lint test synth deploy smoke destroy

setup:
	python3 -m pip install --upgrade pip
	pip install -r requirements-dev.txt
	pip install -e packages/impactmap_core

lint:
	ruff check .
	cd web && npm run lint

test:
	pytest
	cd web && npm test

synth:
	cd infra && cdk synth --all

deploy:
	cd infra && cdk deploy --all --require-approval never --exclude ImpactMapCiStack

smoke:
	bash scripts/smoke.sh

destroy:
	cd infra && cdk destroy --all

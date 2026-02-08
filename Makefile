generate:
	npm run build

run:
	cd examples && npm run dev

deploy: generate
	npm publish --verbose

.PHONY: generate run

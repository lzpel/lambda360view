generate:
	npm install
	npm run build
run:
	cd examples && npm run dev
deploy: generate
	npm publish --verbose
action: generate # github action
	$(MAKE) -C examples generate

.PHONY: generate run

generate:
	npm install
	npm run build
	$(MAKE) -C examples generate
run:
	$(MAKE) -C examples run
deploy: generate
	npm publish --verbose
action: generate # github action
	$(MAKE) -C examples generate

.PHONY: generate run

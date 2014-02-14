
test:
	@./node_modules/.bin/mocha \
		--require should \
		--reporter dot \
		--bail

bench:
	@./node_modules/.bin/matcha

.PHONY: test bench
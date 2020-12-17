# See https://stackoverflow.com/a/18137056
MAKEFILE_PATH := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

# -----------------------------------------------
# Build Configuration
# -----------------------------------------------

# To make sure we don't silently swallow errors
NODE_ARGS = --abort-on-uncaught-exception --stack-trace-limit=100
NODE_DEBUG_ARGS = $(NODE_ARGS) --trace-warnings --stack_trace_on_illegal

# User parameters
AVA_ARGS = $(AVA_OPTS)
ifndef CI
AVA_ARGS += --fail-fast
endif
ifdef MATCH
AVA_ARGS += --match $(MATCH)
endif

FILES ?= "'./lib/**/*.spec.js'"
export FILES

# -----------------------------------------------
# Rules
# -----------------------------------------------

.PHONY: lint
lint:
	npm run lint

.PHONY: lint-fix
lint-fix:
	npm run lint-fix

.PHONY: test
test:
	node $(NODE_DEBUG_ARGS) ./node_modules/.bin/ava -v $(AVA_ARGS) $(FILES)

GJSLINT := --nojsdoc --exclude_directories=node_modules --exclude_files=bin/shot.js --max_line_length=120 --disable=200,201,202,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,230,231,232,233,250,251,252

lint:
	fixjsstyle $(GJSLINT) -r .
	gjslint $(GJSLINT) -r .
	jshint --exclude node_modules .

.PHONY: lint

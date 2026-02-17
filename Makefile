all: data dag site

data:
	python3 ./scripts/dl.py

dag: 
	python3 ./scripts/check.py

site:
	tsc

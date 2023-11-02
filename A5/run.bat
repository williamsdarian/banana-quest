
call pushd front_end
call echo "Type-checking the front end"
call tsc --strict main.ts
call popd
call echo "Type-checking the back end"
call pushd back_end
call py -m mypy main.py --strict --ignore-missing-imports
call echo "Running"
call py main.py
call popd
call echo "Done"
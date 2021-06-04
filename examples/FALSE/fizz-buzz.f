[0 2ø[$3ø>1ø4ø=|][2ø-\1+\]#]f: {given [a,b,c,d] calculate a%b=crd}
20l: {Limit}
1c: {Counter}
0p: {Print number?}
[l;c;>l;c;=|][1p:
c;3f;!0=["Fizz"0p:]?%%% {Divisible by 3}
c;5f;!0=["Buzz"0p:]?%%% {Divisible by 5}
p;1=[c;.]?"
"c;1+c:]#

{Shortened}
[0 2ø[$3ø>1ø4ø=|][2ø-\1+\]#]f:20l:1c:[l;c;>l;c;=|][1p:c;3f;!0=["Fizz"0p:]?%%%c;5f;!0=["Buzz"0p:]?%%%p;1=[c;.]?"
"c;1+c:]#
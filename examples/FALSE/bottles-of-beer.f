99b: {Bottles of beer to start with}
10n: {Code for newline}
[b;0=["No more bottles of beer"]?b;1=["1 bottle of beer"]?b;1>[b;." bottles of beer"]?]a: {Lambda to print the number of bottles}
[b;0>][a;!" on the wall"n;,"Take one down"n;,"Pass it around"n;,b;1-b:a;!" on the wall!"b;0>[n;$,,]?]#
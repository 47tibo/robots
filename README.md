#Simple Robots Game

##Live Demo
[here](http://tcamp.fr/test/robots/)

##Technical Features
  - Two interfaces, `ControlPanel` & `Robot`. ControlPanel is a singleton, Robot can be instanciated any times.
  - An Observable abstract interface, which allows Robot to observe ControlPanel and vice versa. This interface is based on
  a `addUpdateFn()`  and  `notify()` methods. This follows the Observer pattern.
  - The ControlPanel is linked to the UI. It allows to retrieve user's params properly, handle robots (create new ones, send messages, retrieve robots' status) and finally display results.
  - The Robot interface is splited in two parts: static properties, eg `addInstruction()`, which are common to all
  robots - kind of a "robots control center" - and instance properties, like `nextPosition` or `move()`  
  - Instructions are based on two basic moves, `rotate` and `translate`

##Functionnal Features
 - User's inputs are sanitized. Each improperly formatted field is reg flagged and an alert is displayed.
 - Params are checked in number and type, depending on the field. For example, for Mars dimensions, the ControlPanel
 will check for two numbers in the range between 0 and 50. Of course only instructions specified by user are allowed
 - To add a new instruction:
  ```javascript
  Robot.addInstruction( 'X', function x(){
    // 'this' is a robot instance, moves are chainable
    this.rotate( 1 ).translate();
  });
  ```
  Instruction name constraints:
    - max 2 characters
    - if 2 characters, if 2 char must be number + letter, eg '3B', for 3 times backward



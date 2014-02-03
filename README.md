#Simple Robots Game

##Live Demo
[here](http://tcamp.fr/test/robots/)

##Technical Features
  - Two interfaces, `ControlPanel` & `Robot`. ControlPanel is a singleton, Robot can be instanciated any times.
  - An Observable abstract interface, which allows Robot to observe ControlPanel and vice versa. This interface is based on
  a ̀addUpdateFn()` and `notify()` methods. This follow the Observer pattern.
  - The ControlPanel is linked to the UI. It allows to retrieve user's params properly, handle Robots (create new ones, send messages, retrieve Robots' status) and finally display results.
  - The Robot interface is splited in two parts: static properties, eg `addInstruction()̀, which are common to all
  robots, kind of a "robots control center" and instance properties, like `nextPositioǹ or `move()`.
  - Instructions are based on two basic moves, `rotatè and `translatè

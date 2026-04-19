```
class Flingy(EPDOffsetMap, ConstType):
    __slots__ = ()
    sprite: ClassVar[SpriteMember] = SpriteMember("array", 0x6CA318)
    topSpeed: ClassVar[DwordMember] = DwordMember("array", 0x6C9EF8)
    acceleration: ClassVar[WordMember] = WordMember("array", 0x6C9C78)
    haltDistance: ClassVar[DwordMember] = DwordMember("array", 0x6C9930)
    turnSpeed: ClassVar[ByteMember] = ByteMember("array", 0x6C9E20)
    turnRadius = turnSpeed
    # unused: ClassVar[ByteMember] = ByteMember("array", 0x6CA240)
    movementControl: ClassVar[MovementControlMember] = MovementControlMember(
        "array", 0x6C9858
    )

    @ut.classproperty
    def range(self):
        return (0, 208, 1)

    @classmethod
    def cast(cls, _from: _Flingy):
        if isinstance(_from, ConstType) and not isinstance(_from, cls):
            raise ut.EPError(_('"{}" is not a {}').format(_from, cls.__name__))
        return super().cast(_from)

    def __init__(self, initval: _Flingy) -> None:
        super().__init__(EncodeFlingy(initval))
```

export const DAT_FLINGY_NAMES = [
    "sprite",
    "topSpeed",
    "acceleration",
    "haltDistance",
    "turnSpeed",
    "turnRadius",
    "movementControl",
]
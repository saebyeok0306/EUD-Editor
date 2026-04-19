```
class Image(EPDOffsetMap, ConstType):
    __slots__ = ()
    # Read only data skipped
    # grpFile: ClassVar[ArrayMember] = ArrayMember(0x668AA0, Mk.DWORD)
    isTurnable: ClassVar[BoolMember] = BoolMember("array", 0x66E860)
    graphicTurn = isTurnable
    isClickable: ClassVar[BoolMember] = BoolMember("array", 0x66C150)
    useFullIscript: ClassVar[BoolMember] = BoolMember("array", 0x66D4D8)
    drawIfCloaked: ClassVar[BoolMember] = BoolMember("array", 0x667718)
    drawingFunction: ClassVar[DrawingFunctionMember] = DrawingFunctionMember(
        "array", 0x669E28
    )
    # FIXME: Add UnsupportedMember?
    # remapping: ClassVar[ArrayMember] = ArrayMember(0x669A40, Mk.BYTE)
    # Remapping table is skipped because it doesn't work in SC:R
    iscript: ClassVar[IscriptMember] = IscriptMember("array", 0x66EC48)
    # shieldsOverlay: ClassVar[ArrayMember] = ArrayMember(0x66C538, Mk.DWORD)
    # attackOverlay: ClassVar[ArrayMember] = ArrayMember(0x66B1B0, Mk.DWORD)
    # damageOverlay: ClassVar[ArrayMember] = ArrayMember(0x66A210, Mk.DWORD)
    # specialOverlay: ClassVar[ArrayMember] = ArrayMember(0x667B00, Mk.DWORD)
    # landingDustOverlay: ClassVar[ArrayMember] = ArrayMember(0x666778, Mk.DWORD)
    # liftOffDustOverlay: ClassVar[ArrayMember] = ArrayMember(0x66D8C0, Mk.DWORD)

    @ut.classproperty
    def range(self):
        return (0, 998, 1)

    @classmethod
    def cast(cls, _from: _Image):
        if isinstance(_from, ConstType) and not isinstance(_from, cls):
            raise ut.EPError(_('"{}" is not a {}').format(_from, cls.__name__))
        return super().cast(_from)

    def __init__(self, initval: _Image) -> None:
        super().__init__(EncodeImage(initval))
```

export const DAT_IMAGE_NAMES = [
    "isTurnable",
    "isClickable",
    "useFullIscript",
    "drawIfCloaked",
    "drawingFunction",
    "iscript",
]
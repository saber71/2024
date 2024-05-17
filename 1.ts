function A() {
  return (_: any, name: any) => {
    console.log(_, _.constructor, name)
  }
}

class C {
  @A() func() {}
}

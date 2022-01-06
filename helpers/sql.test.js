
const { sqlForPartialUpdate } = require("./sql");


describe("sqlForPartialUpdate", function () {
  test("udpating 1 field", function () {
    const result = sqlForPartialUpdate(
      { field1: "value1" },
      { jsField1: "field1", jsField2: "field2" });
    expect(result).toEqual({
      setCols: "\"field1\"=$1",
      values: ["value1"],
    });
  });

  test("updating 2 fields", function () {
    const result = sqlForPartialUpdate(
        { field1: "value1", field2: "value2" },
        { jsField2: "field2" })
    expect(result).toEqual({
      setCols: "\"field1\"=$1, \"field2\"=$2",
      values: ["value1", "value2"],
    });
  });
});

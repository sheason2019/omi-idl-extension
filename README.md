# Omi-IDL-Extension

Omi 是一个结构化的 Restful IDL，目的是通过易于理解的 IDL 大幅降低前后端接口层对齐的成本，同时使用 Codegen 功能免去编写大量重复的模板代码的负担。

一个最简单的 omi-idl 文件如下所示：

```omi
struct Todo {
  optional repeated string content;
  variable inline
  boolean finish;
  int createTime;
}

service Todo {
  optional repeated Todo GetTodoList();
  void PostTodo(Todo todo);
  void PutTodo(Todo todo);
  void DeleteTodo(Todo todo);
}
```

它在语法上仿造了易于理解的 Thrift 和 Proto3，但因为它本身没有序列化的需求，就更进一步的减少了声明接口所需的文本内容。

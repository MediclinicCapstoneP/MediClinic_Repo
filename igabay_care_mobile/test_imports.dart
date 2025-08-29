import 'package:flutter/material.dart';
import 'package:equatable/equatable.dart';
import 'package:provider/provider.dart';

// Simple test class to verify equatable works
class TestClass extends Equatable {
  final String id;
  final String name;

  const TestClass({required this.id, required this.name});

  @override
  List<Object> get props => [id, name];
}

void main() {
  // Test equatable
  final test1 = TestClass(id: '1', name: 'Test');
  final test2 = TestClass(id: '1', name: 'Test');

  print('Equatable working: ${test1 == test2}');
  print('Flutter imports working: ${MaterialApp}');
  print('Provider imports working: ${Provider}');
  print('All imports successful!');
}

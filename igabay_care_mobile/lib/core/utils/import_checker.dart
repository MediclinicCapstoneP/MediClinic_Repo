/// Import Organization Checker Utility
/// Helps detect duplicate imports and organize them properly

class ImportChecker {
  /// Check for duplicate imports in a Dart file content
  static List<String> findDuplicateImports(String fileContent) {
    final duplicates = <String>[];
    final importLines = <String>[];
    final lines = fileContent.split('\n');

    for (final line in lines) {
      final trimmedLine = line.trim();
      if (trimmedLine.startsWith('import ') && trimmedLine.endsWith(';')) {
        if (importLines.contains(trimmedLine)) {
          duplicates.add(trimmedLine);
        } else {
          importLines.add(trimmedLine);
        }
      }
    }

    return duplicates;
  }

  /// Organize imports according to Flutter style guide
  static String organizeImports(String fileContent) {
    final lines = fileContent.split('\n');
    final dartImports = <String>[];
    final flutterImports = <String>[];
    final packageImports = <String>[];
    final projectImports = <String>[];
    final nonImportLines = <String>[];

    bool inImportSection = true;

    for (final line in lines) {
      final trimmedLine = line.trim();

      if (trimmedLine.startsWith('import ') && trimmedLine.endsWith(';')) {
        if (trimmedLine.contains("import 'dart:")) {
          dartImports.add(line);
        } else if (trimmedLine.contains("import 'package:flutter/")) {
          flutterImports.add(line);
        } else if (trimmedLine.contains("import 'package:")) {
          packageImports.add(line);
        } else {
          projectImports.add(line);
        }
      } else {
        if (inImportSection && trimmedLine.isEmpty) {
          // Skip empty lines in import section
          continue;
        }
        inImportSection = false;
        nonImportLines.add(line);
      }
    }

    // Remove duplicates and sort
    final uniqueDartImports = dartImports.toSet().toList()..sort();
    final uniqueFlutterImports = flutterImports.toSet().toList()..sort();
    final uniquePackageImports = packageImports.toSet().toList()..sort();
    final uniqueProjectImports = projectImports.toSet().toList()..sort();

    // Rebuild file content
    final organizedLines = <String>[];

    // Add imports in order
    if (uniqueDartImports.isNotEmpty) {
      organizedLines.addAll(uniqueDartImports);
      organizedLines.add('');
    }

    if (uniqueFlutterImports.isNotEmpty) {
      organizedLines.addAll(uniqueFlutterImports);
      organizedLines.add('');
    }

    if (uniquePackageImports.isNotEmpty) {
      organizedLines.addAll(uniquePackageImports);
      organizedLines.add('');
    }

    if (uniqueProjectImports.isNotEmpty) {
      organizedLines.addAll(uniqueProjectImports);
      organizedLines.add('');
    }

    // Add the rest of the file
    organizedLines.addAll(nonImportLines);

    return organizedLines.join('\n');
  }

  /// Get import statistics for a file
  static Map<String, int> getImportStats(String fileContent) {
    final lines = fileContent.split('\n');
    int dartImports = 0;
    int flutterImports = 0;
    int packageImports = 0;
    int projectImports = 0;
    int duplicates = 0;

    final seenImports = <String>{};

    for (final line in lines) {
      final trimmedLine = line.trim();
      if (trimmedLine.startsWith('import ') && trimmedLine.endsWith(';')) {
        if (seenImports.contains(trimmedLine)) {
          duplicates++;
        } else {
          seenImports.add(trimmedLine);
        }

        if (trimmedLine.contains("import 'dart:")) {
          dartImports++;
        } else if (trimmedLine.contains("import 'package:flutter/")) {
          flutterImports++;
        } else if (trimmedLine.contains("import 'package:")) {
          packageImports++;
        } else {
          projectImports++;
        }
      }
    }

    return {
      'dart': dartImports,
      'flutter': flutterImports,
      'package': packageImports,
      'project': projectImports,
      'duplicates': duplicates,
    };
  }

  /// Common import patterns for IgabayCare project
  static const Map<String, String> commonImports = {
    'material': "import 'package:flutter/material.dart';",
    'provider': "import 'package:provider/provider.dart';",
    'go_router': "import 'package:go_router/go_router.dart';",
    'supabase': "import 'package:supabase_flutter/supabase_flutter.dart';",
    'intl': "import 'package:intl/intl.dart';",
    'google_fonts': "import 'package:google_fonts/google_fonts.dart';",
  };

  /// Check if standard imports are missing
  static List<String> getMissingStandardImports(
    String fileContent,
    List<String> requiredImports,
  ) {
    final missing = <String>[];

    for (final required in requiredImports) {
      if (commonImports.containsKey(required)) {
        final importStatement = commonImports[required]!;
        if (!fileContent.contains(importStatement)) {
          missing.add(importStatement);
        }
      }
    }

    return missing;
  }

  /// Format imports with proper spacing
  static String formatImports(List<String> imports) {
    if (imports.isEmpty) return '';

    final formatted = imports.map((import) {
      if (!import.trim().endsWith(';')) {
        return import.trim() + ';';
      }
      return import.trim();
    }).toList();

    return formatted.join('\n') + '\n';
  }
}

/// Usage example and testing
void main() {
  // Example usage
  const sampleFileContent = '''
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container();
  }
}
''';

  print('=== Import Analysis ===');

  // Check for duplicates
  final duplicates = ImportChecker.findDuplicateImports(sampleFileContent);
  print('Duplicate imports found: $duplicates');

  // Get stats
  final stats = ImportChecker.getImportStats(sampleFileContent);
  print('Import statistics: $stats');

  // Organize imports
  final organized = ImportChecker.organizeImports(sampleFileContent);
  print('Organized content:');
  print(organized);
}

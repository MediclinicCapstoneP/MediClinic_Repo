/// Database Service
/// Handles direct database operations and query management
///
/// This file provides database services for the IgabayCare mobile app.
/// Due to Flutter package resolution issues, it uses custom implementations instead of:
/// - package:supabase_flutter/supabase_flutter.dart (replaced with MockSupabase classes)
///
/// The mock implementations maintain API compatibility for future migration
/// back to real packages when the environment issues are resolved.

// Custom implementations to replace unavailable packages
// import 'package:supabase_flutter/supabase_flutter.dart'; // Replaced with MockSupabase
import '../interfaces/auth_service_interface.dart';

/// Mock Postgrest Exception
class PostgrestException implements Exception {
  final String message;
  final String? code;

  const PostgrestException({required this.message, this.code});

  @override
  String toString() => 'PostgrestException: $message';
}

/// Mock Count Option enum
enum CountOption { exact, planned, estimated }

/// Mock Fetch Options
class FetchOptions {
  final CountOption? count;

  const FetchOptions({this.count});
}

/// Mock Postgrest Query Builder
class MockPostgrestQueryBuilder {
  final String tableName;
  final Map<String, dynamic> _filters = {};
  final List<String> _selectColumns = [];
  String? _orderColumn;
  bool _ascending = true;
  int? _limitValue;
  int? _rangeStart;
  int? _rangeEnd;
  bool _isSingle = false;
  bool _countExact = false;
  String? _searchColumn;
  String? _searchTerm;

  MockPostgrestQueryBuilder(this.tableName);

  MockPostgrestQueryBuilder select([String? columns]) {
    if (columns != null) {
      _selectColumns.clear();
      _selectColumns.addAll(columns.split(',').map((c) => c.trim()));
    }
    return this;
  }

  MockPostgrestQueryBuilder select2(String columns, [FetchOptions? options]) {
    _selectColumns.clear();
    _selectColumns.addAll(columns.split(',').map((c) => c.trim()));
    if (options?.count == CountOption.exact) {
      _countExact = true;
    }
    return this;
  }

  MockPostgrestQueryBuilder eq(String column, dynamic value) {
    _filters[column] = value;
    return this;
  }

  MockPostgrestQueryBuilder order(String column, {bool ascending = true}) {
    _orderColumn = column;
    _ascending = ascending;
    return this;
  }

  MockPostgrestQueryBuilder limit(int count) {
    _limitValue = count;
    return this;
  }

  MockPostgrestQueryBuilder range(int start, int end) {
    _rangeStart = start;
    _rangeEnd = end;
    return this;
  }

  MockPostgrestQueryBuilder ilike(String column, String pattern) {
    _searchColumn = column;
    _searchTerm = pattern.replaceAll('%', '');
    return this;
  }

  Future<dynamic> single() async {
    _isSingle = true;
    final results = await _executeQuery();
    if (results is List && results.isEmpty) {
      throw const PostgrestException(
        message: 'No rows found',
        code: 'PGRST116',
      );
    }
    return results is List ? results.first : results;
  }

  Future<dynamic> call() async {
    return await _executeQuery();
  }

  /// Get count from response
  int? get count {
    final result = _executeQuery();
    if (result is MockPostgrestResponse) {
      return (result as MockPostgrestResponse).count;
    }
    return null;
  }

  Future<dynamic> _executeQuery() async {
    await Future.delayed(const Duration(milliseconds: 100));
    print('[MockPostgrest] Query on $tableName with filters: $_filters');

    // Generate mock data based on table
    final mockData = _generateMockData();

    // Apply filters
    var filteredData = mockData;
    if (_filters.isNotEmpty) {
      filteredData = mockData.where((item) {
        return _filters.entries.every((filter) {
          return item[filter.key] == filter.value;
        });
      }).toList();
    }

    // Apply search
    if (_searchColumn != null && _searchTerm != null) {
      filteredData = filteredData.where((item) {
        final value = item[_searchColumn!]?.toString().toLowerCase() ?? '';
        return value.contains(_searchTerm!.toLowerCase());
      }).toList();
    }

    // Apply ordering
    if (_orderColumn != null) {
      filteredData.sort((a, b) {
        final valueA = a[_orderColumn!] ?? '';
        final valueB = b[_orderColumn!] ?? '';
        final comparison = valueA.toString().compareTo(valueB.toString());
        return _ascending ? comparison : -comparison;
      });
    }

    // Apply range/limit
    if (_rangeStart != null && _rangeEnd != null) {
      final start = _rangeStart!;
      final end = (_rangeEnd! + 1).clamp(0, filteredData.length);
      filteredData = filteredData.sublist(
        start.clamp(0, filteredData.length),
        end,
      );
    } else if (_limitValue != null) {
      filteredData = filteredData.take(_limitValue!).toList();
    }

    // Handle count
    if (_countExact) {
      final result = MockPostgrestResponse(
        filteredData,
        count: mockData.length,
      );
      return result;
    }

    return _isSingle
        ? (filteredData.isNotEmpty ? filteredData.first : null)
        : filteredData;
  }

  List<Map<String, dynamic>> _generateMockData() {
    switch (tableName) {
      case 'profiles':
        return [
          {
            'id': 'profile-1',
            'email': 'user1@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'role': 'patient',
            'created_at': DateTime.now().toIso8601String(),
            'updated_at': DateTime.now().toIso8601String(),
          },
          {
            'id': 'profile-2',
            'email': 'clinic@example.com',
            'first_name': 'Health',
            'last_name': 'Clinic',
            'role': 'clinic',
            'created_at': DateTime.now().toIso8601String(),
            'updated_at': DateTime.now().toIso8601String(),
          },
        ];
      case 'clinic_profiles':
        return [
          {
            'id': 'clinic-1',
            'user_id': 'profile-2',
            'clinic_name': 'Central Health Clinic',
            'email': 'clinic@example.com',
            'status': 'approved',
            'specialties': ['General Medicine', 'Pediatrics'],
            'created_at': DateTime.now().toIso8601String(),
            'updated_at': DateTime.now().toIso8601String(),
          },
        ];
      case 'patient_profiles':
        return [
          {
            'id': 'patient-1',
            'user_id': 'profile-1',
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'user1@example.com',
            'created_at': DateTime.now().toIso8601String(),
            'updated_at': DateTime.now().toIso8601String(),
          },
        ];
      case 'appointments':
        return [
          {
            'id': 'appointment-1',
            'patient_id': 'patient-1',
            'clinic_id': 'clinic-1',
            'status': 'confirmed',
            'created_at': DateTime.now().toIso8601String(),
            'updated_at': DateTime.now().toIso8601String(),
          },
        ];
      default:
        return [
          {
            'id': 'mock-id-1',
            'created_at': DateTime.now().toIso8601String(),
            'updated_at': DateTime.now().toIso8601String(),
          },
        ];
    }
  }
}

/// Mock Postgrest Response with count
class MockPostgrestResponse extends Iterable<Map<String, dynamic>> {
  final List<Map<String, dynamic>> _data;
  final int? count;

  MockPostgrestResponse(this._data, {this.count});

  @override
  Iterator<Map<String, dynamic>> get iterator => _data.iterator;

  @override
  List<Map<String, dynamic>> toList({bool growable = true}) =>
      growable ? List.from(_data) : List.unmodifiable(_data);

  Map<String, dynamic> get first => _data.first;
  bool get isEmpty => _data.isEmpty;
  bool get isNotEmpty => _data.isNotEmpty;
  int get length => _data.length;
}

/// Mock Postgrest Insert Builder
class MockPostgrestInsertBuilder {
  final String tableName;
  final dynamic insertData;

  MockPostgrestInsertBuilder(this.tableName, this.insertData);

  MockPostgrestQueryBuilder select([String? columns]) {
    final builder = MockPostgrestQueryBuilder(tableName);
    if (columns != null) {
      builder.select(columns);
    }
    return builder;
  }

  Future<void> call() async {
    await Future.delayed(const Duration(milliseconds: 100));
    print('[MockPostgrest] INSERT into $tableName: $insertData');
  }
}

/// Mock Postgrest Update Builder
class MockPostgrestUpdateBuilder {
  final String tableName;
  final Map<String, dynamic> updateData;
  final Map<String, dynamic> _filters = {};

  MockPostgrestUpdateBuilder(this.tableName, this.updateData);

  MockPostgrestUpdateBuilder eq(String column, dynamic value) {
    _filters[column] = value;
    return this;
  }

  MockPostgrestQueryBuilder select([String? columns]) {
    final builder = MockPostgrestQueryBuilder(tableName);
    if (columns != null) {
      builder.select(columns);
    }
    // Apply the same filters
    for (final entry in _filters.entries) {
      builder.eq(entry.key, entry.value);
    }
    return builder;
  }

  Future<void> call() async {
    await Future.delayed(const Duration(milliseconds: 100));
    print(
      '[MockPostgrest] UPDATE $tableName with filters $_filters: $updateData',
    );
  }
}

/// Mock Postgrest Delete Builder
class MockPostgrestDeleteBuilder {
  final String tableName;
  final Map<String, dynamic> _filters = {};

  MockPostgrestDeleteBuilder(this.tableName);

  MockPostgrestDeleteBuilder eq(String column, dynamic value) {
    _filters[column] = value;
    return this;
  }

  Future<void> call() async {
    await Future.delayed(const Duration(milliseconds: 100));
    print('[MockPostgrest] DELETE from $tableName with filters: $_filters');
  }
}

/// Mock Supabase Client
class SupabaseClient {
  MockPostgrestQueryBuilder from(String table) {
    return MockPostgrestQueryBuilder(table);
  }

  MockPostgrestInsertBuilder insert(String table, dynamic data) {
    return MockPostgrestInsertBuilder(table, data);
  }

  MockPostgrestUpdateBuilder update(String table, Map<String, dynamic> data) {
    return MockPostgrestUpdateBuilder(table, data);
  }

  MockPostgrestDeleteBuilder delete(String table) {
    return MockPostgrestDeleteBuilder(table);
  }

  Future<T> rpc<T>(String functionName, {Map<String, dynamic>? params}) async {
    await Future.delayed(const Duration(milliseconds: 200));
    print('[MockSupabase] RPC call: $functionName with params: $params');

    // Return mock data based on function name
    switch (functionName) {
      case 'search_clinics_by_specialty':
        return [] as T;
      case 'get_nearby_clinics':
        return [] as T;
      case 'get_clinic_statistics':
        return {
              'total_appointments': 0,
              'completed_appointments': 0,
              'pending_appointments': 0,
              'cancelled_appointments': 0,
              'average_rating': 0.0,
              'total_reviews': 0,
              'total_patients': 0,
            }
            as T;
      default:
        return {} as T;
    }
  }
}

/// Mock Supabase singleton
class Supabase {
  static final Supabase _instance = Supabase._internal();
  static Supabase get instance => _instance;

  Supabase._internal();

  final SupabaseClient _client = SupabaseClient();
  SupabaseClient get client => _client;
}

/// Database service for handling Supabase operations
class DatabaseService {
  static final DatabaseService _instance = DatabaseService._internal();
  factory DatabaseService() => _instance;
  DatabaseService._internal();

  late final SupabaseClient _client;

  /// Initialize the database service
  void initialize() {
    _client = Supabase.instance.client;
  }

  /// Get the Supabase client
  SupabaseClient get client => _client;

  /// Execute a query with error handling
  Future<ServiceResult<T>> executeQuery<T>(Future<T> Function() query) async {
    try {
      final result = await query();
      return ServiceResult.success(result);
    } on PostgrestException catch (e) {
      return ServiceResult.failure('Database error: ${e.message}', e.code);
    } catch (e) {
      return ServiceResult.failure(
        'Unexpected database error: ${e.toString()}',
        'DATABASE_ERROR',
      );
    }
  }

  /// Generic select query
  Future<ServiceResult<List<Map<String, dynamic>>>> select(
    String table, {
    String? select,
    Map<String, dynamic>? filters,
    String? orderBy,
    bool ascending = true,
    int? limit,
  }) async {
    return executeQuery(() async {
      var query = _client.from(table);

      if (select != null) {
        query = query.select(select);
      } else {
        query = query.select();
      }

      if (filters != null) {
        for (final entry in filters.entries) {
          query = query.eq(entry.key, entry.value);
        }
      }

      if (orderBy != null) {
        query = query.order(orderBy, ascending: ascending);
      }

      if (limit != null) {
        query = query.limit(limit);
      }

      return await query.call() as List<Map<String, dynamic>>;
    });
  }

  /// Generic select single query
  Future<ServiceResult<Map<String, dynamic>>> selectSingle(
    String table, {
    String? select,
    required Map<String, dynamic> filters,
  }) async {
    return executeQuery(() async {
      var query = _client.from(table);

      if (select != null) {
        query = query.select(select);
      } else {
        query = query.select();
      }

      for (final entry in filters.entries) {
        query = query.eq(entry.key, entry.value);
      }

      return await query.single();
    });
  }

  /// Generic insert query
  Future<ServiceResult<Map<String, dynamic>>> insert(
    String table,
    Map<String, dynamic> data,
  ) async {
    return executeQuery(() async {
      // Mock insert operation
      await _client.insert(table, data).call();

      // Return the inserted data with a mock ID
      final result = Map<String, dynamic>.from(data);
      result['id'] =
          result['id'] ?? 'mock-${DateTime.now().millisecondsSinceEpoch}';
      result['created_at'] =
          result['created_at'] ?? DateTime.now().toIso8601String();
      result['updated_at'] =
          result['updated_at'] ?? DateTime.now().toIso8601String();

      return result;
    });
  }

  /// Generic update query
  Future<ServiceResult<Map<String, dynamic>>> update(
    String table,
    Map<String, dynamic> data,
    Map<String, dynamic> filters,
  ) async {
    return executeQuery(() async {
      // Mock update operation
      var updateBuilder = _client.update(table, data);

      for (final entry in filters.entries) {
        updateBuilder = updateBuilder.eq(entry.key, entry.value);
      }

      await updateBuilder.call();

      // Return updated data
      final result = Map<String, dynamic>.from(data);
      result.addAll(filters);
      result['updated_at'] = DateTime.now().toIso8601String();

      return result;
    });
  }

  /// Generic delete query
  Future<ServiceResult<void>> delete(
    String table,
    Map<String, dynamic> filters,
  ) async {
    return executeQuery(() async {
      var deleteBuilder = _client.delete(table);

      for (final entry in filters.entries) {
        deleteBuilder = deleteBuilder.eq(entry.key, entry.value);
      }

      await deleteBuilder.call();
    });
  }

  /// Search query with text search
  Future<ServiceResult<List<Map<String, dynamic>>>> search(
    String table,
    String column,
    String searchTerm, {
    String? select,
    Map<String, dynamic>? additionalFilters,
    int? limit,
  }) async {
    return executeQuery(() async {
      var query = _client.from(table);

      if (select != null) {
        query = query.select(select);
      } else {
        query = query.select();
      }

      query = query.ilike(column, '%$searchTerm%');

      if (additionalFilters != null) {
        for (final entry in additionalFilters.entries) {
          query = query.eq(entry.key, entry.value);
        }
      }

      if (limit != null) {
        query = query.limit(limit);
      }

      return await query.call() as List<Map<String, dynamic>>;
    });
  }

  /// Execute RPC (Remote Procedure Call)
  Future<ServiceResult<T>> rpc<T>(
    String functionName, {
    Map<String, dynamic>? params,
  }) async {
    return executeQuery(() async {
      final result = await _client.rpc(functionName, params: params);
      return result as T;
    });
  }

  /// Batch operations
  Future<ServiceResult<void>> batchInsert(
    String table,
    List<Map<String, dynamic>> data,
  ) async {
    return executeQuery(() async {
      await _client.insert(table, data).call();
    });
  }

  /// Count records
  Future<ServiceResult<int>> count(
    String table, {
    Map<String, dynamic>? filters,
  }) async {
    return executeQuery(() async {
      var query = _client
          .from(table)
          .select2('*', const FetchOptions(count: CountOption.exact));

      if (filters != null) {
        for (final entry in filters.entries) {
          query = query.eq(entry.key, entry.value);
        }
      }

      final response = await query.call();
      if (response is MockPostgrestResponse) {
        return response.count ?? 0;
      }
      return 0;
    });
  }

  /// Check if record exists
  Future<ServiceResult<bool>> exists(
    String table,
    Map<String, dynamic> filters,
  ) async {
    return executeQuery(() async {
      var query = _client.from(table).select('id');

      for (final entry in filters.entries) {
        query = query.eq(entry.key, entry.value);
      }

      try {
        await query.single();
        return true;
      } on PostgrestException catch (e) {
        if (e.code == 'PGRST116') {
          // No rows found
          return false;
        }
        rethrow;
      }
    });
  }

  /// Get paginated results
  Future<ServiceResult<PaginatedResult<T>>> paginate<T>(
    String table,
    T Function(Map<String, dynamic>) fromJson, {
    String? select,
    Map<String, dynamic>? filters,
    String? orderBy,
    bool ascending = true,
    int page = 1,
    int pageSize = 20,
  }) async {
    return executeQuery(() async {
      var query = _client.from(table);

      if (select != null) {
        query = query.select2(
          select,
          const FetchOptions(count: CountOption.exact),
        );
      } else {
        query = query.select2(
          '*',
          const FetchOptions(count: CountOption.exact),
        );
      }

      if (filters != null) {
        for (final entry in filters.entries) {
          query = query.eq(entry.key, entry.value);
        }
      }

      if (orderBy != null) {
        query = query.order(orderBy, ascending: ascending);
      }

      final start = (page - 1) * pageSize;
      final end = start + pageSize - 1;

      query = query.range(start, end);

      final response = await query.call();
      final responseObj = response is MockPostgrestResponse
          ? response
          : MockPostgrestResponse(
              response as List<Map<String, dynamic>>,
              count: (response as List).length,
            );
      final data = (responseObj as List<dynamic>)
          .map((item) => fromJson(item as Map<String, dynamic>))
          .toList();

      return PaginatedResult<T>(
        data: data,
        totalCount: responseObj.count ?? 0,
        page: page,
        pageSize: pageSize,
        hasNextPage: responseObj.count != null && end < responseObj.count! - 1,
        hasPreviousPage: page > 1,
      );
    });
  }
}

/// Paginated result helper class
class PaginatedResult<T> {
  final List<T> data;
  final int totalCount;
  final int page;
  final int pageSize;
  final bool hasNextPage;
  final bool hasPreviousPage;

  const PaginatedResult({
    required this.data,
    required this.totalCount,
    required this.page,
    required this.pageSize,
    required this.hasNextPage,
    required this.hasPreviousPage,
  });

  int get totalPages => (totalCount / pageSize).ceil();
  bool get isEmpty => data.isEmpty;
  bool get isNotEmpty => data.isNotEmpty;
}

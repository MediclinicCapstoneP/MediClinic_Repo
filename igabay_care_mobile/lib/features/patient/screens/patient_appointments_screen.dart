// Custom Flutter Material Design Implementation
// This replaces Flutter Material, GoRouter, and Provider packages due to package resolution issues
import '../../../core/providers/auth_provider.dart';
import '../../../core/services/appointment_service.dart';
import '../../../core/models/appointment.dart';
import '../widgets/patient_bottom_nav.dart';
import '../widgets/patient_widgets.dart';
import '../../../core/custom_flutter/custom_flutter.dart';

class PatientAppointmentsScreen extends StatefulWidget {
  const PatientAppointmentsScreen({super.key});

  @override
  State<PatientAppointmentsScreen> createState() =>
      _PatientAppointmentsScreenState();
}

class _PatientAppointmentsScreenState extends State<PatientAppointmentsScreen>
    with SingleTickerProviderStateMixin {
  final AppointmentService _appointmentService = AppointmentService();
  late TabController _tabController;

  List<Appointment> _upcomingAppointments = [];
  List<Appointment> _pastAppointments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadAppointments();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAppointments() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final patientId = authProvider.user?.patientProfile?.id;

    if (patientId == null) {
      setState(() {
        _isLoading = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final allAppointments = await _appointmentService.getPatientAppointments(
        patientId,
      );
      final now = DateTime.now();

      setState(() {
        _upcomingAppointments = allAppointments.where((appointment) {
          return appointment.appointmentDateTime.isAfter(now) &&
              (appointment.status == AppointmentStatus.scheduled ||
                  appointment.status == AppointmentStatus.confirmed);
        }).toList();

        _pastAppointments = allAppointments.where((appointment) {
          return appointment.appointmentDateTime.isBefore(now) ||
              appointment.status == AppointmentStatus.completed ||
              appointment.status == AppointmentStatus.cancelled;
        }).toList();

        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading appointments: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Appointments'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/patient'),
        ),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.schedule),
                  const SizedBox(width: 8),
                  Text('Upcoming (${_upcomingAppointments.length})'),
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.history),
                  const SizedBox(width: 8),
                  Text('Past (${_pastAppointments.length})'),
                ],
              ),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadAppointments,
              child: TabBarView(
                controller: _tabController,
                children: [
                  // Upcoming Appointments
                  _buildAppointmentsList(
                    appointments: _upcomingAppointments,
                    emptyMessage: 'No upcoming appointments',
                    emptySubtitle: 'Book your next appointment to see it here',
                    showActions: true,
                  ),

                  // Past Appointments
                  _buildAppointmentsList(
                    appointments: _pastAppointments,
                    emptyMessage: 'No past appointments',
                    emptySubtitle: 'Your appointment history will appear here',
                    showActions: false,
                  ),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/patient/book-appointment'),
        icon: const Icon(Icons.add),
        label: const Text('Book Appointment'),
      ),
      bottomNavigationBar: const PatientBottomNav(currentIndex: 1),
    );
  }

  Widget _buildAppointmentsList({
    required List<Appointment> appointments,
    required String emptyMessage,
    required String emptySubtitle,
    required bool showActions,
  }) {
    if (appointments.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.calendar_today_outlined,
                size: 64,
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
              ),
              const SizedBox(height: 24),
              Text(
                emptyMessage,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withOpacity(0.7),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                emptySubtitle,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withOpacity(0.5),
                ),
                textAlign: TextAlign.center,
              ),
              if (showActions) ...[
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => context.go('/patient/book-appointment'),
                  child: const Text('Book Your First Appointment'),
                ),
              ],
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: appointments.length,
      itemBuilder: (context, index) {
        final appointment = appointments[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: AppointmentCard(
            appointment: appointment,
            showActions: showActions,
            onCancel: showActions
                ? () => _cancelAppointment(appointment)
                : null,
          ),
        );
      },
    );
  }

  Future<void> _cancelAppointment(Appointment appointment) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Appointment'),
        content: const Text(
          'Are you sure you want to cancel this appointment? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Keep Appointment'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Cancel Appointment'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _appointmentService.cancelAppointment(
          appointmentId: appointment.id,
          cancelledBy: 'patient',
          cancellationReason: 'Cancelled by patient',
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Appointment cancelled successfully'),
              backgroundColor: Colors.green,
            ),
          );
          _loadAppointments();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error cancelling appointment: $e')),
          );
        }
      }
    }
  }

  Future<void> _rescheduleAppointment(Appointment appointment) async {
    // For now, navigate to book appointment screen
    // In a full implementation, this would open a reschedule dialog
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Reschedule feature coming soon. Please cancel and book a new appointment.',
        ),
      ),
    );
  }
}

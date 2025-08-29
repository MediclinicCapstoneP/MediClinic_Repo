// Custom Flutter Material Design Implementation
// This replaces Flutter Material package due to package resolution issues

import '../../../core/models/appointment.dart';
import '../../../core/custom_flutter/custom_flutter.dart';

// Patient-specific UI components
class QuickActionsGrid extends StatelessWidget {
  const QuickActionsGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        children: [
          _buildQuickActionCard(
            context,
            icon: Icons.search,
            title: 'Find Doctor',
            subtitle: 'Search for doctors',
            onTap: () => context.go('/patient/find-doctor'),
          ),
          _buildQuickActionCard(
            context,
            icon: Icons.calendar_today,
            title: 'Book Appointment',
            subtitle: 'Schedule a visit',
            onTap: () => context.go('/patient/book-appointment'),
          ),
          _buildQuickActionCard(
            context,
            icon: Icons.local_hospital,
            title: 'Medical Records',
            subtitle: 'View your history',
            onTap: () => context.go('/patient/medical-records'),
          ),
          _buildQuickActionCard(
            context,
            icon: Icons.medical_services,
            title: 'Prescriptions',
            subtitle: 'Manage medications',
            onTap: () => context.go('/patient/prescriptions'),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 32,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(height: 8),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Appointment Card Widget
class AppointmentCard extends StatelessWidget {
  final Appointment appointment;
  final bool showActions;
  final VoidCallback? onCancel;

  const AppointmentCard({
    super.key,
    required this.appointment,
    this.showActions = false,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        appointment.doctorName ?? 'Unknown Doctor',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        appointment.clinic?.clinicName ?? 'General Practice',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(
                            context,
                          ).colorScheme.onSurface.withOpacity(0.7),
                        ),
                      ),
                    ],
                  ),
                ),
                _buildStatusChip(context),
              ],
            ),
            const Divider(height: 24),
            Row(
              children: [
                Icon(
                  Icons.calendar_today,
                  size: 16,
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withOpacity(0.6),
                ),
                const SizedBox(width: 8),
                Text(
                  _formatDate(appointment.appointmentDateTime),
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(width: 16),
                Icon(
                  Icons.schedule,
                  size: 16,
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withOpacity(0.6),
                ),
                const SizedBox(width: 8),
                Text(
                  _formatTime(appointment.appointmentDateTime),
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
            if (appointment.patientNotes != null &&
                appointment.patientNotes!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.note_alt,
                    size: 16,
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withOpacity(0.6),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      appointment.patientNotes!,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            ],
            if (showActions && onCancel != null) ...[
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: onCancel,
                    child: Text(
                      'Cancel',
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(BuildContext context) {
    Color color;
    String label;
    IconData icon;

    switch (appointment.status) {
      case AppointmentStatus.scheduled:
        color = Colors.blue;
        label = 'Scheduled';
        icon = Icons.schedule;
        break;
      case AppointmentStatus.confirmed:
        color = Colors.green;
        label = 'Confirmed';
        icon = Icons.check_circle;
        break;
      case AppointmentStatus.inProgress:
        color = Colors.orange;
        label = 'In Progress';
        icon = Icons.schedule;
        break;
      case AppointmentStatus.completed:
        color = Colors.green;
        label = 'Completed';
        icon = Icons.check_circle;
        break;
      case AppointmentStatus.cancelled:
        color = Colors.red;
        label = 'Cancelled';
        icon = Icons.cancel;
        break;
      case AppointmentStatus.noShow:
        color = Colors.orange;
        label = 'No Show';
        icon = Icons.cancel;
        break;
      case AppointmentStatus.rescheduled:
        color = Colors.purple;
        label = 'Rescheduled';
        icon = Icons.schedule;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime dateTime) {
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${months[dateTime.month - 1]} ${dateTime.day}, ${dateTime.year}';
  }

  String _formatTime(DateTime dateTime) {
    final hour = dateTime.hour == 0
        ? 12
        : (dateTime.hour > 12 ? dateTime.hour - 12 : dateTime.hour);
    final minute = dateTime.minute.toString().padLeft(2, '0');
    final period = dateTime.hour < 12 ? 'AM' : 'PM';
    return '$hour:$minute $period';
  }
}

// Upcoming Appointments Card Widget
class UpcomingAppointmentsCard extends StatelessWidget {
  final Appointment appointment;

  const UpcomingAppointmentsCard({super.key, required this.appointment});

  @override
  Widget build(BuildContext context) {
    return AppointmentCard(appointment: appointment, showActions: false);
  }
}

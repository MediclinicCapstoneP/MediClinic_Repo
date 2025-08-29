// Custom Flutter Material Design Implementation
// This replaces Flutter Material, GoRouter, and Provider packages due to package resolution issues
import '../../../core/providers/auth_provider.dart';
import '../../../core/services/appointment_service.dart';
import '../../../core/models/appointment.dart';
import '../widgets/patient_bottom_nav.dart';
import '../widgets/patient_widgets.dart';
import '../../../core/custom_flutter/custom_flutter.dart';

class PatientHomeScreen extends StatefulWidget {
  const PatientHomeScreen({super.key});

  @override
  State<PatientHomeScreen> createState() => _PatientHomeScreenState();
}

class _PatientHomeScreenState extends State<PatientHomeScreen> {
  final AppointmentService _appointmentService = AppointmentService();
  List<Appointment> _upcomingAppointments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUpcomingAppointments();
  }

  Future<void> _loadUpcomingAppointments() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final patientId = authProvider.user?.patientProfile?.id;

    if (patientId != null) {
      try {
        final appointments = await _appointmentService.getUpcomingAppointments(
          patientId: patientId,
          limit: 3,
        );
        if (mounted) {
          setState(() {
            _upcomingAppointments = appointments;
            _isLoading = false;
          });
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
      }
    } else {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadUpcomingAppointments,
          child: CustomScrollView(
            slivers: [
              // App Bar
              SliverAppBar(
                floating: true,
                backgroundColor: Theme.of(context).colorScheme.surface,
                elevation: 0,
                title: Consumer<AuthProvider>(
                  builder: (context, authProvider, child) {
                    final profile = authProvider.user?.patientProfile;
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome back,',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurface.withOpacity(0.7),
                              ),
                        ),
                        Text(
                          profile?.firstName ?? 'Patient',
                          style: Theme.of(context).textTheme.headlineSmall
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ],
                    );
                  },
                ),
                actions: [
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined),
                    onPressed: () {
                      // TODO: Navigate to notifications
                    },
                  ),
                  Consumer<AuthProvider>(
                    builder: (context, authProvider, child) {
                      final profilePicture =
                          authProvider.user?.patientProfile?.profilePictureUrl;
                      return Padding(
                        padding: const EdgeInsets.only(right: 16),
                        child: GestureDetector(
                          onTap: () => context.go('/patient/profile'),
                          child: CircleAvatar(
                            radius: 18,
                            backgroundColor: Theme.of(
                              context,
                            ).colorScheme.primary.withOpacity(0.1),
                            backgroundImage: profilePicture != null
                                ? NetworkImage(profilePicture)
                                : null,
                            child: profilePicture == null
                                ? Icon(
                                    Icons.person,
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.primary,
                                    size: 20,
                                  )
                                : null,
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),

              // Content
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // Quick Actions
                    const QuickActionsGrid(),

                    const SizedBox(height: 24),

                    // Upcoming Appointments
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Upcoming Appointments',
                          style: Theme.of(context).textTheme.headlineSmall
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        TextButton(
                          onPressed: () => context.go('/patient/appointments'),
                          child: const Text('View All'),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    if (_isLoading)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(32),
                          child: CircularProgressIndicator(),
                        ),
                      )
                    else if (_upcomingAppointments.isEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: Theme.of(
                              context,
                            ).colorScheme.outline.withOpacity(0.2),
                          ),
                        ),
                        child: Column(
                          children: [
                            Icon(
                              Icons.calendar_today_outlined,
                              size: 48,
                              color: Theme.of(
                                context,
                              ).colorScheme.onSurface.withOpacity(0.5),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No upcoming appointments',
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.onSurface.withOpacity(0.7),
                                  ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Book your first appointment to get started',
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.onSurface.withOpacity(0.5),
                                  ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: () =>
                                  context.go('/patient/book-appointment'),
                              child: const Text('Book Appointment'),
                            ),
                          ],
                        ),
                      )
                    else
                      ...(_upcomingAppointments
                          .map(
                            (appointment) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: UpcomingAppointmentsCard(
                                appointment: appointment,
                              ),
                            ),
                          )
                          .toList()),

                    const SizedBox(height: 24),

                    // Health Tips Section
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Theme.of(
                              context,
                            ).colorScheme.primary.withOpacity(0.1),
                            Theme.of(
                              context,
                            ).colorScheme.secondary.withOpacity(0.1),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.lightbulb_outline,
                                color: Theme.of(context).colorScheme.primary,
                              ),
                              const SizedBox(width: 12),
                              Text(
                                'Health Tip of the Day',
                                style: Theme.of(context).textTheme.titleMedium
                                    ?.copyWith(fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Stay hydrated! Drinking enough water helps maintain your body temperature, keeps joints lubricated, and helps transport nutrients.',
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurface.withOpacity(0.8),
                                ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const PatientBottomNav(currentIndex: 0),
    );
  }
}

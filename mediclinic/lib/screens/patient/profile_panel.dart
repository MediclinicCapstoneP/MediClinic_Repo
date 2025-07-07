import 'package:flutter/material.dart';

class ProfilePanel extends StatelessWidget {
  const ProfilePanel({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF2176AE),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              const SizedBox(height: 24),
              CircleAvatar(
                radius: 44,
                backgroundImage: AssetImage('assets/avatar.png'), // Replace with user's avatar
              ),
              const SizedBox(height: 16),
              const Text(
                'Shahin Alam',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 22,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'UI Designer',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 32),
              _ProfileButton(
                icon: Icons.settings,
                label: 'Account Settings',
                onTap: () {},
              ),
              const SizedBox(height: 16),
              _ProfileButton(
                icon: Icons.privacy_tip,
                label: 'Privacy Policy',
                onTap: () {},
              ),
              const SizedBox(height: 16),
              _ProfileButton(
                icon: Icons.payment,
                label: 'Payment Settings',
                onTap: () {},
              ),
              const SizedBox(height: 16),
              _ProfileButton(
                icon: Icons.receipt_long,
                label: 'Payment Settings',
                onTap: () {},
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: () {
                  // TODO: Implement logout logic
                },
                icon: const Icon(Icons.logout, color: Colors.white),
                label: const Text(
                  'Log Out',
                  style: TextStyle(color: Colors.white, fontSize: 16),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ProfileButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 18),
          child: Row(
            children: [
              Icon(icon, color: const Color(0xFF2176AE)),
              const SizedBox(width: 18),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    color: Color(0xFF2176AE),
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 18, color: Color(0xFF2176AE)),
            ],
          ),
        ),
      ),
    );
  }
}
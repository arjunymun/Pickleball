import styles from "@/components/customer/academy-customer.module.css";
export default function CustomerLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.loading} role="status">
        Loading your account…
      </div>
    </div>
  );
}

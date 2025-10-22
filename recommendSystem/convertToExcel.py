





import pandas as pd

# 🔹 1. Nhập đường dẫn file CSV và Excel đầu ra
input_csv = "recommendSystem/socialmedia.csv"        # tên file CSV của bạn
output_excel = "./recommendSystem/data.xlsx"    # tên file Excel sau khi chuyển

# 🔹 2. Đọc file CSV
df = pd.read_csv(input_csv)

# 🔹 3. Ghi sang file Excel (.xlsx)
df.to_excel(output_excel, index=False)

print(f"✅ Đã chuyển '{input_csv}' sang '{output_excel}' thành công!")
